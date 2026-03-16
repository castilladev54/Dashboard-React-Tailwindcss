import { motion } from "framer-motion";
import Input from "../components/Input.jsx";
import { Loader, Lock, Mail, User } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PasswordStrengthMeter from "../components/PasswordStrengthMeter";
import Button from "../components/Button";
import { useAuthStore } from "../store/authStore";
import { authContent } from "../constants";

const SignUpPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const { signup, error, isLoading } = useAuthStore();

  const handleSignUp = async (e) => {
    e.preventDefault();

    try {
      await signup(email, password, name);
      navigate("/verify-email");
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-md w-full bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden relative group"
    >
      <div className='absolute inset-0 bg-gradient-to-r from-orange-600/0 via-amber-500/0 to-orange-600/0 group-hover:from-orange-600/20 group-hover:via-amber-500/10 group-hover:to-orange-600/20 blur-2xl transition-all duration-500 -z-10 rounded-2xl'></div>
      <div className="p-8 relative">
        <h2 className="text-3xl font-bold mb-2 text-center text-white">
          {authContent.signup.title}
        </h2>
        <p className='text-white/60 text-center mb-6'>{authContent.signup.subtitle}</p>

        <form onSubmit={handleSignUp}>
          <Input
            icon={User}
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            icon={Mail}
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            icon={Lock}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-red-500 font-semibold mt-2">{error}</p>}
          <PasswordStrengthMeter password={password} />

          <Button
            className="mt-5 w-full"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader className=" animate-spin mx-auto" size={24} />
            ) : (
              authContent.signup.button
            )}
          </Button>
        </form>
      </div>
      <div className="px-8 py-4 bg-white/5 border-t border-white/10 flex justify-center relative z-10">
        <p className="text-sm text-white/60">
          {authContent.signup.footer}{" "}
          <Link to={"/login"} className="text-amber-500 hover:text-amber-400 hover:underline">
            {authContent.signup.link}
          </Link>
        </p>
      </div>
    </motion.div>
  );
};
export default SignUpPage;
