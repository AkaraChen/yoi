package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/fsnotify/fsnotify"
	"github.com/gorilla/websocket"
)

type storeEvent struct {
	Type string `json:"type"`
	Path string `json:"path,omitempty"`
}

type hub struct {
	mu      sync.Mutex
	clients map[chan []byte]struct{}
}

func newHub() *hub {
	return &hub{clients: map[chan []byte]struct{}{}}
}

func (h *hub) subscribe() chan []byte {
	ch := make(chan []byte, 4)
	h.mu.Lock()
	h.clients[ch] = struct{}{}
	h.mu.Unlock()
	return ch
}

func (h *hub) unsubscribe(ch chan []byte) {
	h.mu.Lock()
	delete(h.clients, ch)
	h.mu.Unlock()
	close(ch)
}

func (h *hub) publish(v storeEvent) {
	data, err := json.Marshal(v)
	if err != nil {
		return
	}
	h.mu.Lock()
	defer h.mu.Unlock()
	for ch := range h.clients {
		select {
		case ch <- data:
		default:
		}
	}
}

var wsUpgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

func (s *server) handleWS(w http.ResponseWriter, r *http.Request) {
	conn, err := wsUpgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	defer conn.Close()
	ch := s.hub.subscribe()
	defer s.hub.unsubscribe(ch)

	done := make(chan struct{})
	go func() {
		defer close(done)
		for {
			if _, _, err := conn.NextReader(); err != nil {
				return
			}
		}
	}()
	for {
		select {
		case <-done:
			return
		case msg, ok := <-ch:
			if !ok {
				return
			}
			if err := conn.WriteMessage(websocket.TextMessage, msg); err != nil {
				return
			}
		}
	}
}

func (s *server) watchStore() {
	go watchLoop(s.storeRoot, s.hub)
}

func watchLoop(root string, h *hub) {
	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		log.Printf("store watch disabled: %v", err)
		return
	}
	defer watcher.Close()

	addTree := func(dir string) {
		_ = filepath.WalkDir(dir, func(path string, d os.DirEntry, err error) error {
			if err != nil || !d.IsDir() {
				return nil
			}
			_ = watcher.Add(path)
			return nil
		})
	}

	if info, err := os.Stat(root); err == nil && info.IsDir() {
		addTree(root)
	} else {
		_ = watcher.Add(filepath.Dir(root))
	}

	var (
		mu      sync.Mutex
		timer   *time.Timer
		pending string
	)
	flush := func() {
		mu.Lock()
		path := pending
		pending = ""
		timer = nil
		mu.Unlock()
		rel := path
		if r, err := filepath.Rel(root, path); err == nil {
			rel = r
		}
		h.publish(storeEvent{Type: "store", Path: rel})
	}

	for {
		select {
		case ev, ok := <-watcher.Events:
			if !ok {
				return
			}
			if ev.Op&(fsnotify.Create|fsnotify.Write|fsnotify.Remove|fsnotify.Rename) == 0 {
				continue
			}
			if info, err := os.Stat(ev.Name); err == nil && info.IsDir() {
				addTree(ev.Name)
			}
			if ev.Name == root || strings.HasPrefix(ev.Name, root+string(os.PathSeparator)) {
				if strings.HasPrefix(filepath.Base(ev.Name), ".") {
					continue
				}
			}
			mu.Lock()
			pending = ev.Name
			if timer == nil {
				timer = time.AfterFunc(200*time.Millisecond, flush)
			} else {
				timer.Reset(200 * time.Millisecond)
			}
			mu.Unlock()
		case err, ok := <-watcher.Errors:
			if !ok {
				return
			}
			log.Printf("store watch: %v", err)
		}
	}
}
