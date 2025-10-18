import { useState } from "react";
import icons from "../constants/icons.ts";
import {useAuth} from "../contexts/AuthContext.tsx";

const SignUp = (props: {handleCloseModal: ()=>void}) => {
    const {handleCloseModal} = props
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSignUp, setIsSignUp] = useState(true);
    const {signUpNewUser, signInUser} = useAuth()
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            if (isSignUp) {
                const response = await signUpNewUser(email, password);

                if (response?.error) {
                    throw response.error;
                }
                setError("");
                handleCloseModal()


            } else {
                const response = await signInUser(email, password);
                if (response?.error) {
                    throw response.error;
                }
                setError("");
                handleCloseModal()
            }
        } catch (err: unknown) {
            const message =
                err instanceof Error ? err.message :
                    typeof err === "string" ? err : "Something went wrong. Please try again."
            setError(message);

        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="
        w-full h-full bg-brand-green rounded-2xl shadow-2xl
        px-10 py-12 flex flex-col items-center justify-center
        space-y-10
      "
        >
            {/* Header */}
            <h1 className="text-4xl font-bold text-brand-yellow text-center leading-tight">
                {isSignUp ? "Sign Up" : "Sign In"}{" "}
                <span className="block text-white text-xl font-medium mt-2">
          Start tracking your analytics today.
        </span>
            </h1>

            {/* Form */}
            <form
                onSubmit={handleSubmit}
                className="flex flex-col w-full max-w-md items-stretch gap-8"
            >
                {/* Email */}
                <div className="relative">
                    <img
                        src={icons.envelope}
                        alt=""
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 opacity-80"
                    />
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email"
                        className="
              w-full bg-brand-gray text-white placeholder:text-gray-400
              rounded-lg py-3 pl-12 pr-4 text-base
              border border-transparent
              outline-none focus:outline-none
              focus:ring-2 focus:ring-brand-yellow
              focus:ring-offset-2 focus:ring-offset-brand-green
              transition duration-150
            "
                        required
                    />
                </div>

                {/* Password */}
                <div className="relative">
                    <img
                        src={icons.lock}
                        alt=""
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 opacity-80"
                    />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        className="
              w-full bg-brand-gray text-white placeholder:text-gray-400
              rounded-lg py-3 pl-12 pr-4 text-base
              border border-transparent
              outline-none focus:outline-none
              focus:ring-2 focus:ring-brand-yellow
              focus:ring-offset-2 focus:ring-offset-brand-green
              transition duration-150
            "
                        required
                    />
                </div>

                {/* Submit button */}
                <button
                    type="submit"
                    className="
            w-full mt-2 rounded-lg bg-brand-yellow text-brand-green font-bold
            text-lg py-3 tracking-wide
            shadow-[0_6px_0_rgba(0,0,0,0.25)]
            transition-transform duration-100 ease-out
            hover:translate-y-[1px] hover:shadow-[0_5px_0_rgba(0,0,0,0.25)]
            active:translate-y-[2px] active:shadow-none
            focus:outline-none focus:ring-2 focus:ring-brand-yellow/70
          "
                >
                    {loading ? (
                        <div className="flex items-center justify-center gap-3">
                            <span>Loading...</span>
                        </div>
                    ): (
                        isSignUp ? "Create Account" : "Sign In"
                    )}
                </button>
            </form>
            {/*Display error message*/}
            {error && (
                <p className="text-red-400 text-sm font-medium text-center">
                    {error}
                </p>
            )}

            {/* Switch between Sign In / Up */}
            <div className="flex items-center gap-2 text-white text-sm mt-4">
                {isSignUp ? (
                    <p>Already have an account?</p>
                ) : (
                    <p>Don't have an account?</p>
                )}
                <button
                    type="button"
                    className="
            font-semibold text-brand-yellow hover:text-yellow-300 transition
          "
                    onClick={() => setIsSignUp(!isSignUp)}
                >
                    {isSignUp ? "Sign In" : "Sign Up"}
                </button>
            </div>
        </div>

    );
};

export default SignUp;
