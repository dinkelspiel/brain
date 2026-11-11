import { Head } from '@inertiajs/react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { FormField } from '@/components/form-field';
import { Button } from '@/components/ui/button';
import { useSetup } from '@/hooks/use-session';
import { ApiError } from '@/lib/api';

export default function Setup() {
    const setup = useSetup();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');

    const errors = setup.error instanceof ApiError ? setup.error.errors : {};

    function submit(event: FormEvent) {
        event.preventDefault();
        setup.mutate({
            username,
            password,
            password_confirmation: passwordConfirmation,
        });
    }

    return (
        <>
            <Head title="Setup" />
            <form onSubmit={submit} className="mx-auto max-w-xs space-y-3">
                <div>
                    <h1 className="text-lg font-semibold">Setup</h1>
                    <p className="text-xs text-mauve-600 dark:text-mauve-400">
                        No account exists yet. Create the account you will log
                        in with.
                    </p>
                </div>
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
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    error={errors.password?.[0]}
                />
                <FormField
                    label="Confirm password"
                    name="password_confirmation"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={passwordConfirmation}
                    onChange={(event) =>
                        setPasswordConfirmation(event.target.value)
                    }
                    error={errors.password_confirmation?.[0]}
                />
                {setup.isError &&
                    !(
                        setup.error instanceof ApiError &&
                        setup.error.status === 422
                    ) && (
                        <p className="text-xs text-red-700 dark:text-red-400">
                            {setup.error.message}
                        </p>
                    )}
                <Button type="submit" disabled={setup.isPending}>
                    Create account
                </Button>
            </form>
        </>
    );
}
