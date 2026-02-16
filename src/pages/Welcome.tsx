import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import logo from "@/assets/logo.png";

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="flex flex-col items-center text-center"
      >
        <img
          src={logo}
          alt="Logo Abogado Experto en Tránsito"
          className="mb-8 h-32 w-32 object-contain"
        />
        <h1 className="mb-4 text-2xl font-bold leading-tight text-foreground md:text-3xl">
          Abogado Experto en Tránsito y Transporte Col
        </h1>
        <p className="mb-10 max-w-sm text-sm text-muted-foreground">
          Asesoría legal automatizada especializada en tránsito y transporte en Colombia
        </p>
        <button
          onClick={() => navigate("/auth")}
          className="rounded-lg bg-primary px-10 py-4 text-lg font-bold uppercase tracking-wider text-primary-foreground shadow-lg transition-all hover:brightness-110 active:scale-95"
        >
          Iniciar Asesoría
        </button>
      </motion.div>
    </div>
  );
};

export default Welcome;
