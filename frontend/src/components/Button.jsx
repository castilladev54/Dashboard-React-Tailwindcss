const Button = ({ children, className = '', ...props }) => {
    return (
        <button
            className={`px-4 py-2 rounded-lg font-semibold text-white bg-gradient-to-r from-orange-600 to-amber-500 hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-lg shadow-orange-900/20 ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
