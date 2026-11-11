import { Head } from '@inertiajs/react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { FormField } from '@/components/form-field';
import { Button } from '@/components/ui/button';
import { useLogin } from '@/hooks/use-session';
import { ApiError } from '@/lib/api';

export default function Login() {
    const login = useLogin();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(true);

    const errors = login.error instanceof ApiError ? login.error.errors : {};

    function submit(event: FormEvent) {
        event.preventDefault();
        login.mutate({ username, password, remember });
    }

    return (
        <>
            <Head title="Log in" />
            <form onSubmit={submit} className="mx-auto max-w-xs space-y-3">
                <h1 className="text-lg font-semibold">Log in</h1>
                <FormField
                    label="Username"
                    name="username"
                    autoComplete="username"
                    autoFocus
                    required
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    error={errors.username?.[0]}
                />
                <FormField
                    label="Password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    error={errors.password?.[0]}
                />
                <label className="flex items-center gap-2 text-xs">
                    <input
                        type="checkbox"
                        checked={remember}
                        onChange={(event) => setRemember(event.target.checked)}
                        className="accent-mauve-700 dark:accent-mauve-300"
                    />
                    Remember me
                </label>
                {login.isError &&
                    !(
                        login.error instanceof ApiError &&
                        login.error.status === 422
                    ) && (
                        <p className="text-xs text-red-700 dark:text-red-400">
                            {login.error.message}
                        </p>
                    )}
                <Button type="submit" disabled={login.isPending}>
                    Log in
                </Button>
            </form>
        </>
    );
}
