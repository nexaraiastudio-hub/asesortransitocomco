import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import logo from "@/assets/logo.png";

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 pb-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="flex flex-col items-center text-center"
      >
        <img
          src={logo}
          alt="Logo Abogado Experto en Tránsito"
          className="-mb-16 h-96 w-96 object-contain md:-mb-20 md:h-[30rem] md:w-[30rem]"
        />
        <p className="mb-3 max-w-md text-base font-medium text-foreground md:text-lg">
          Asesoría legal automatizada especializada en tránsito y transporte en Colombia
        </p>
        <button
          onClick={() => navigate("/auth")}
          className="rounded-lg bg-primary px-10 py-4 text-lg font-bold uppercase tracking-wider text-primary-foreground shadow-lg transition-all hover:brightness-110 active:scale-95"
        >
          Iniciar Asesoría
        </button>
      </motion.div>

      <p className="absolute bottom-6 text-sm font-medium text-primary opacity-80">
        by Nexara IA Studio
      </p>
    </div>
  );
};

export default Welcome;
