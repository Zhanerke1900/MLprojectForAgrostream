import { SectionIntro, SiteShell } from "@/components/site/SiteShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage, type Language } from "@/lib/i18n";
import { trpc } from "@/lib/trpc";
import { KeyRound, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";

const resetCopy: Record<Language, any> = {
  ru: {
    hero: {
      eyebrow: "Новый пароль",
      title: "Задайте новый пароль для аккаунта",
      description: "После сохранения вы сразу войдете в систему.",
    },
    password: "Новый пароль",
    confirm: "Повторите пароль",
    placeholder: "Минимум 8 символов",
    submit: "Сохранить пароль",
    loading: "Сохраняем...",
    mismatch: "Пароли не совпадают.",
    missingToken: "Ссылка сброса некорректная или устарела.",
    error: "Не удалось сменить пароль. Запросите новую ссылку.",
    back: "Вернуться ко входу",
  },
  en: {
    hero: {
      eyebrow: "New password",
      title: "Set a new account password",
      description: "After saving, you will be signed in automatically.",
    },
    password: "New password",
    confirm: "Repeat password",
    placeholder: "At least 8 characters",
    submit: "Save password",
    loading: "Saving...",
    mismatch: "Passwords do not match.",
    missingToken: "The reset link is invalid or expired.",
    error: "Could not change password. Request a new link.",
    back: "Back to sign in",
  },
};

function getResetToken() {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("token") ?? "";
}

export default function ResetPassword() {
  const { language } = useLanguage();
  const t = resetCopy[language];
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const token = useMemo(getResetToken, []);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(token ? null : t.missingToken);
  const resetMutation = trpc.auth.resetPassword.useMutation();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError(t.mismatch);
      return;
    }

    try {
      const result = await resetMutation.mutateAsync({ token, password });
      await utils.auth.me.invalidate();
      setLocation(result.user.role === "admin" ? "/admin" : "/forecast");
    } catch {
      setError(t.error);
    }
  }

  return (
    <SiteShell>
      <section className="mx-auto max-w-3xl px-4 pb-8 pt-14 lg:pt-18">
        <div className="panel-surface p-7 sm:p-9">
          <SectionIntro
            eyebrow={t.hero.eyebrow}
            title={t.hero.title}
            description={t.hero.description}
          />

          <form className="mt-8 grid gap-5" onSubmit={handleSubmit}>
            <PasswordField
              id="new-password"
              label={t.password}
              value={password}
              placeholder={t.placeholder}
              onChange={setPassword}
            />
            <PasswordField
              id="confirm-password"
              label={t.confirm}
              value={confirm}
              placeholder={t.placeholder}
              onChange={setConfirm}
            />
            <Button
              type="submit"
              disabled={!token || resetMutation.isPending}
              className="h-12 rounded-full bg-[#163d2b] text-white hover:bg-[#112d20]"
            >
              {resetMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t.loading}
                </>
              ) : (
                <>
                  <KeyRound className="mr-2 h-4 w-4" />
                  {t.submit}
                </>
              )}
            </Button>
          </form>

          {error ? (
            <p className="mt-6 rounded-2xl border border-red-500/12 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <Link href="/auth">
            <a className="mt-6 inline-flex text-sm font-semibold text-[#163d2b] hover:text-[#112d20]">
              {t.back}
            </a>
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}

function PasswordField({
  id,
  label,
  value,
  placeholder,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <Label htmlFor={id} className="flex items-center gap-3 text-sm font-medium text-slate-800">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f1e9d7] text-[#163d2b]">
          <KeyRound className="h-4 w-4" />
        </span>
        {label}
      </Label>
      <Input
        id={id}
        type="password"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-4 h-12 rounded-2xl border-slate-900/8 bg-white/92"
        required
      />
    </div>
  );
}
