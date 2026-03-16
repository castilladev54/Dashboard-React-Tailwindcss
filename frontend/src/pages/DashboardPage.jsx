import { motion } from "framer-motion";
import { useAuthStore } from "../store/authStore";
import { formatDate } from "../utils/date";
import Button from "../components/Button";
import { authContent } from "../constants";

const DashboardPage = () => {
	const { user, logout } = useAuthStore();

	const handleLogout = () => {
		logout();
	};
	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.9 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.9 }}
			transition={{ duration: 0.5 }}
			className='max-w-md w-full mx-auto mt-10 p-8 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl relative group overflow-hidden'
		>
			<div className='absolute inset-0 bg-gradient-to-r from-orange-600/0 via-amber-500/0 to-orange-600/0 group-hover:from-orange-600/20 group-hover:via-amber-500/10 group-hover:to-orange-600/20 blur-2xl transition-all duration-500 -z-10 rounded-2xl'></div>
			<h2 className='text-3xl font-bold mb-6 text-center text-white'>
				{authContent.dashboard.title}
			</h2>

			<div className='space-y-6'>
				<motion.div
					className='p-4 bg-white/5 bg-opacity-50 rounded-lg border border-white/10'
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2 }}
				>
					<h3 className='text-xl font-semibold text-amber-500 mb-3'>{authContent.dashboard.profileInfo}</h3>
					<p className='text-white/80'><span className='font-bold'>{authContent.dashboard.nameLabel}</span>{user.name}</p>
					<p className='text-white/80'><span className='font-bold'>{authContent.dashboard.emailLabel}</span>{user.email}</p>
				</motion.div>
				<motion.div
					className='p-4 bg-white/5 bg-opacity-50 rounded-lg border border-white/10'
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.4 }}
				>
					<h3 className='text-xl font-semibold text-amber-500 mb-3'>{authContent.dashboard.accountActivity}</h3>
					<p className='text-white/80'>
						<span className='font-bold'>{authContent.dashboard.joinedLabel}</span>
						{new Date(user.createdAt).toLocaleDateString("en-US", {
							year: "numeric",
							month: "long",
							day: "numeric",
						})}
					</p>
					<p className='text-white/80 mt-1'>
						<span className='font-bold'>{authContent.dashboard.lastLoginLabel}</span>
						{formatDate(user.lastLogin)}
					</p>
				</motion.div>
			</div>

			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.6 }}
				className='mt-6'
			>
				<Button onClick={handleLogout} className="w-full">
					{authContent.dashboard.logoutButton}
				</Button>
			</motion.div>
		</motion.div>
	);
};
export default DashboardPage;