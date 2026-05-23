"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

interface AuthAwareHomeLinkProps {
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}

export default function AuthAwareHomeLink({
  children,
  className,
  ariaLabel = "AntiCode home or dashboard",
}: AuthAwareHomeLinkProps) {
  const [href, setHref] = useState("/");

  useEffect(() => {
    let mounted = true;
    const hasDemoSession = () => (
      typeof window !== "undefined" && !!localStorage.getItem("demo_role")
    );

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setHref(data.session?.user || hasDemoSession() ? "/dashboard" : "/");
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setHref(session?.user || hasDemoSession() ? "/dashboard" : "/");
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <Link href={href} aria-label={ariaLabel} className={className}>
      {children}
    </Link>
  );
}
