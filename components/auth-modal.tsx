import { useState } from 'react';
import styles from './auth-modal.module.css';
import { Button } from './ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '../hooks/use-toast';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password);
        toast({
          title: 'Conta criada!',
          description: 'Verifique seu email para confirmar a conta.',
        });
      } else {
        await signIn(email, password);
        toast({
          title: 'Login realizado!',
          description: 'Bem-vindo ao BizuDesk.',
        });
        onOpenChange(false);
      }
    } catch (error: unknown) {
      let message = 'Ocorreu um erro durante a autenticação.';
      if (error instanceof Error) message = error.message;
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.dialog} style={{ display: open ? 'flex' : 'none' }}>
      <div className={styles.dialogContent}>
        <div className={styles.dialogHeader}>
          <h2 className={styles.dialogTitle}>
            {isSignUp ? 'Criar conta' : 'Entrar no BizuDesk'}
          </h2>
          <p className={styles.dialogSubtitle}>
            {isSignUp ? 'Crie sua conta para continuar' : 'Acesse sua conta para continuar'}
          </p>
        </div>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.email@curseduca.com"
              required
              className={styles.input}
            />
          </div>
          <div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className={styles.input}
            />
          </div>
          <Button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Carregando...' : (isSignUp ? 'Criar conta' : 'Entrar')}
          </Button>
        </form>
        <div className={styles.switchMode}>
          <p>
            {isSignUp ? 'Já tem conta?' : 'Não tem conta?'}
            <button
              type="button"
              className={styles.switchBtn}
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? 'Fazer login' : 'Criar conta'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
} 