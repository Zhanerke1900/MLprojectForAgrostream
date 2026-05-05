import { SectionIntro, SiteShell } from "@/components/site/SiteShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage, type Language } from "@/lib/i18n";
import { trpc } from "@/lib/trpc";
import { KeyRound, Loader2, LogIn, Mail, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";

const authCopy: Record<Language, any> = {
  ru: {
    hero: {
      eyebrow: "Аккаунт",
      title: "Вход, регистрация и восстановление доступа",
      description:
        "Админская вкладка появляется только у аккаунта с ролью администратора.",
    },
    tabs: {
      login: "Вход",
      register: "Регистрация",
      forgot: "Забыли пароль",
    },
    fields: {
      name: "Имя",
      email: "Email",
      password: "Пароль",
    },
    placeholders: {
      name: "Ваше имя",
      email: "zhanerke1900gmail.com",
      password: "Минимум 8 символов",
    },
    actions: {
      login: "Войти",
      register: "Создать аккаунт",
      forgot: "Отправить ссылку",
      loading: "Подождите...",
    },
    messages: {
      loginError: "Не удалось войти. Проверьте email и пароль.",
      registerError: "Не удалось создать аккаунт.",
      forgotSuccess: "Если аккаунт найден, письмо со ссылкой отправлено.",
      forgotError: "Не удалось отправить письмо. Проверьте настройки Gmail API.",
    },
  },
  en: {
    hero: {
      eyebrow: "Account",
      title: "Sign in, registration, and password recovery",
      description: "The admin tab is shown only for accounts with the admin role.",
    },
    tabs: {
      login: "Sign in",
      register: "Register",
      forgot: "Forgot password",
    },
    fields: {
      name: "Name",
      email: "Email",
      password: "Password",
    },
    placeholders: {
      name: "Your name",
      email: "zhanerke1900gmail.com",
      password: "At least 8 characters",
    },
    actions: {
      login: "Sign in",
      register: "Create account",
      forgot: "Send link",
      loading: "Please wait...",
    },
    messages: {
      loginError: "Could not sign in. Check email and password.",
      registerError: "Could not create account.",
      forgotSuccess: "If the account exists, a reset email has been sent.",
      forgotError: "Could not send email. Check Gmail API settings.",
    },
  },
};

function getSafeNextPath() {
  if (typeof window === "undefined") return "";

  const next = new URLSearchParams(window.location.search).get("next") ?? "";
  return next.startsWith("/") ? next : "";
}

function getDestination(role: "user" | "admin", nextPath: string) {
  if (role === "admin") {
    return nextPath || "/admin";
  }

  return nextPath && !nextPath.startsWith("/admin") ? nextPath : "/forecast";
}

export default function Auth() {
  const { language } = useLanguage();
  const t = authCopy[language];
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const nextPath = useMemo(getSafeNextPath, []);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [forgotEmail, setForgotEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loginMutation = trpc.auth.login.useMutation();
  const registerMutation = trpc.auth.register.useMutation();
  const forgotMutation = trpc.auth.forgotPassword.useMutation();
  const isBusy =
    loginMutation.isPending || registerMutation.isPending || forgotMutation.isPending;

  async function finishAuth(result: { user: { role: "user" | "admin" } }) {
    await utils.auth.me.invalidate();
    setLocation(getDestination(result.user.role, nextPath));
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);

    try {
      const result = await loginMutation.mutateAsync(loginForm);
      await finishAuth(result);
    } catch {
      setError(t.messages.loginError);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);

    try {
      const result = await registerMutation.mutateAsync(registerForm);
      await finishAuth(result);
    } catch {
      setError(t.messages.registerError);
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);

    try {
      await forgotMutation.mutateAsync({
        email: forgotEmail,
        language,
      });
      setMessage(t.messages.forgotSuccess);
    } catch {
      setError(t.messages.forgotError);
    }
  }

  return (
    <SiteShell>
      <section className="mx-auto max-w-5xl px-4 pb-8 pt-14 lg:pt-18">
        <div className="panel-surface p-7 sm:p-9">
          <SectionIntro
            eyebrow={t.hero.eyebrow}
            title={t.hero.title}
            description={t.hero.description}
          />

          <Tabs defaultValue="login" className="mt-8">
            <TabsList className="grid h-auto w-full grid-cols-3 rounded-full bg-[#f1e9d7] p-1">
              <TabsTrigger value="login" className="rounded-full">
                {t.tabs.login}
              </TabsTrigger>
              <TabsTrigger value="register" className="rounded-full">
                {t.tabs.register}
              </TabsTrigger>
              <TabsTrigger value="forgot" className="rounded-full">
                {t.tabs.forgot}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-7">
              <form className="grid gap-5" onSubmit={handleLogin}>
                <AuthField
                  icon={Mail}
                  id="login-email"
                  label={t.fields.email}
                  value={loginForm.email}
                  placeholder={t.placeholders.email}
                  onChange={email => setLoginForm(prev => ({ ...prev, email }))}
                />
                <AuthField
                  icon={KeyRound}
                  id="login-password"
                  label={t.fields.password}
                  type="password"
                  value={loginForm.password}
                  placeholder={t.placeholders.password}
                  onChange={password => setLoginForm(prev => ({ ...prev, password }))}
                />
                <SubmitButton
                  icon={LogIn}
                  label={t.actions.login}
                  loadingLabel={t.actions.loading}
                  loading={isBusy}
                />
              </form>
            </TabsContent>

            <TabsContent value="register" className="mt-7">
              <form className="grid gap-5" onSubmit={handleRegister}>
                <AuthField
                  icon={UserPlus}
                  id="register-name"
                  label={t.fields.name}
                  value={registerForm.name}
                  placeholder={t.placeholders.name}
                  onChange={name => setRegisterForm(prev => ({ ...prev, name }))}
                />
                <AuthField
                  icon={Mail}
                  id="register-email"
                  label={t.fields.email}
                  value={registerForm.email}
                  placeholder={t.placeholders.email}
                  onChange={email => setRegisterForm(prev => ({ ...prev, email }))}
                />
                <AuthField
                  icon={KeyRound}
                  id="register-password"
                  label={t.fields.password}
                  type="password"
                  value={registerForm.password}
                  placeholder={t.placeholders.password}
                  onChange={password => setRegisterForm(prev => ({ ...prev, password }))}
                />
                <SubmitButton
                  icon={UserPlus}
                  label={t.actions.register}
                  loadingLabel={t.actions.loading}
                  loading={isBusy}
                />
              </form>
            </TabsContent>

            <TabsContent value="forgot" className="mt-7">
              <form className="grid gap-5" onSubmit={handleForgotPassword}>
                <AuthField
                  icon={Mail}
                  id="forgot-email"
                  label={t.fields.email}
                  value={forgotEmail}
                  placeholder={t.placeholders.email}
                  onChange={setForgotEmail}
                />
                <SubmitButton
                  icon={Mail}
                  label={t.actions.forgot}
                  loadingLabel={t.actions.loading}
                  loading={isBusy}
                />
              </form>
            </TabsContent>
          </Tabs>

          {message ? (
            <p className="mt-6 rounded-2xl border border-emerald-500/15 bg-emerald-50 p-4 text-sm text-emerald-700">
              {message}
            </p>
          ) : null}
          {error ? (
            <p className="mt-6 rounded-2xl border border-red-500/12 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </p>
          ) : null}
        </div>
      </section>
    </SiteShell>
  );
}

function AuthField({
  icon: Icon,
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  icon: React.ComponentType<{ className?: string }>;
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <div>
      <Label htmlFor={id} className="flex items-center gap-3 text-sm font-medium text-slate-800">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f1e9d7] text-[#163d2b]">
          <Icon className="h-4 w-4" />
        </span>
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        inputMode={type === "text" ? "email" : undefined}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-4 h-12 rounded-2xl border-slate-900/8 bg-white/92"
        required
      />
    </div>
  );
}

function SubmitButton({
  icon: Icon,
  label,
  loadingLabel,
  loading,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  loadingLabel: string;
  loading: boolean;
}) {
  return (
    <Button
      type="submit"
      disabled={loading}
      className="h-12 rounded-full bg-[#163d2b] text-white hover:bg-[#112d20]"
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingLabel}
        </>
      ) : (
        <>
          <Icon className="mr-2 h-4 w-4" />
          {label}
        </>
      )}
    </Button>
  );
}
