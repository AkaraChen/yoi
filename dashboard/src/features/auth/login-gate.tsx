import { useState, type FC, type FormEvent, type ReactNode } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { login, SESSION_KEY } from "@/lib/api";

type LoginGateProps = {
  children: ReactNode;
};

export const LoginGate: FC<LoginGateProps> = ({ children }) => {
  const [authed, setAuthed] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === "1",
  );
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setFailed(false);
    const ok = await login(password);
    setPending(false);
    if (ok) {
      sessionStorage.setItem(SESSION_KEY, "1");
      setAuthed(true);
    } else {
      setFailed(true);
    }
  }

  if (authed) return <>{children}</>;

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <Lock className="size-4 text-muted-foreground" />
            输入密码以继续
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <Input
              type="password"
              autoFocus
              placeholder="面板密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {failed && <p className="text-sm text-destructive">密码不正确，请重试。</p>}
            <Button type="submit" className="rounded-full" disabled={pending}>
              {pending ? "验证中…" : "进入面板"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              默认密码 yoi，可用环境变量 YOI_DASHBOARD_PASSWORD 修改
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
