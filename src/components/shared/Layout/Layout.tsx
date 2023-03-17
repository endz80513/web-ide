import { useAuthAction } from '@/hooks/auth.hooks';
import Router, { useRouter } from 'next/router';
import { FC, useEffect } from 'react';
import s from './Layout.module.scss';

interface Props {
  className?: string;
  children: React.ReactNode;
}
export const Layout: FC<Props> = ({ className, children }) => {
  const router = useRouter();
  const { user } = useAuthAction();

  useEffect(() => {
    if (!user.token && router.pathname !== '/project/[id]') {
      Router.push('/');
    }
    if (user.token && router.pathname === '/') {
      Router.push('/project');
      return;
    }
  }, [user.token]);
  return <main className={s.root}>{children}</main>;
};

export default Layout;
