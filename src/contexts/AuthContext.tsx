import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "../supabaseClient";
import type { Session } from "@supabase/supabase-js";


type AuthContextValue = {
    session: Session | null;
    signUpNewUser: (email: string, password: string) => Promise<{ success: boolean; data?: any; error?: any }>;
    signInUser: (email: string, password: string) => Promise<{ success: boolean; data?: any; error?: any }>;
    signOutUser: () => Promise<{ success: boolean; error?: any }>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);

    // ---------------- Email validator ----------------
    const isValidEmail = (email: string): boolean => {
        // Clean and check shape
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
    };

    // ---------------- SIGN UP ----------------
    const signUpNewUser: AuthContextValue["signUpNewUser"] = async (rawEmail, password) => {
        const email = rawEmail.trim().toLowerCase();

        if (!isValidEmail(email)) {
            return { success: false, error: { message: "Please enter a valid email address." } };
        }

        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) {
            return { success: false, error: { message: error.message || "Unable to sign up." } };
        }
        return { success: true, data };
    };

    // ---------------- SIGN IN ----------------
    const signInUser: AuthContextValue["signInUser"] = async (rawEmail, password) => {
        const email = rawEmail.trim().toLowerCase();

        if (!isValidEmail(email)) {
            return { success: false, error: { message: "Please enter a valid email address." } };
        }

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            return { success: false, error: { message: error.message || "Unable to sign in." } };
        }
        return { success: true, data };
    };

    // ---------------- SIGN OUT ----------------
    const signOutUser: AuthContextValue["signOutUser"] = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            return { success: false, error: { message: error.message || "Unable to sign out." } };
        }
        setSession(null);
        console.log("User successfully logged out.");
        return { success: true, data: undefined };
    };

    // ---------------- LISTEN TO SESSION CHANGES ----------------
    useEffect(() => {
        let mounted = true;

        supabase.auth.getSession().then(({ data: { session } }) => {
            if (mounted) setSession(session);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (mounted) setSession(session);
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    return (
        <AuthContext.Provider value={{ session, signUpNewUser, signInUser, signOutUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
    return ctx;
};
