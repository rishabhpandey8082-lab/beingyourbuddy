import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sphere, MeshDistortMaterial, Environment } from "@react-three/drei";
import * as THREE from "three";
import { motion } from "framer-motion";

interface AvatarHeadProps {
  isSpeaking: boolean;
  isListening: boolean;
}

const AvatarHead = ({ isSpeaking, isListening }: AvatarHeadProps) => {
  const headRef = useRef<THREE.Mesh>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const mouthRef = useRef<THREE.Mesh>(null);

  // Subtle breathing/idle animation
  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    if (headRef.current) {
      // Breathing effect
      headRef.current.position.y = Math.sin(time * 0.8) * 0.02;
      // Slight head movement
      headRef.current.rotation.y = Math.sin(time * 0.3) * 0.05;
      headRef.current.rotation.x = Math.sin(time * 0.5) * 0.02;
    }

    // Eye tracking - simulate soft focus
    if (leftEyeRef.current && rightEyeRef.current) {
      const eyeX = Math.sin(time * 0.4) * 0.02;
      const eyeY = Math.sin(time * 0.6) * 0.01;
      leftEyeRef.current.position.x = -0.15 + eyeX;
      leftEyeRef.current.position.y = 0.1 + eyeY;
      rightEyeRef.current.position.x = 0.15 + eyeX;
      rightEyeRef.current.position.y = 0.1 + eyeY;
    }

    // Lip sync simulation
    if (mouthRef.current) {
      if (isSpeaking) {
        const speakScale = 0.8 + Math.sin(time * 15) * 0.3 + Math.sin(time * 23) * 0.2;
        mouthRef.current.scale.y = speakScale;
        mouthRef.current.scale.x = 1 + Math.sin(time * 12) * 0.1;
      } else {
        mouthRef.current.scale.y = 0.8;
        mouthRef.current.scale.x = 1;
      }
    }
  });

  const headColor = useMemo(
    () => (isListening ? "#6366f1" : isSpeaking ? "#8b5cf6" : "#4f46e5"),
    [isListening, isSpeaking]
  );

  return (
    <group>
      {/* Main head */}
      <Sphere ref={headRef} args={[1, 64, 64]} position={[0, 0, 0]}>
        <MeshDistortMaterial
          color={headColor}
          roughness={0.2}
          metalness={0.3}
          distort={isSpeaking ? 0.2 : 0.1}
          speed={isSpeaking ? 4 : 2}
        />
      </Sphere>

      {/* Left eye */}
      <mesh ref={leftEyeRef} position={[-0.15, 0.1, 0.85]}>
        <sphereGeometry args={[0.12, 32, 32]} />
        <meshStandardMaterial color="#ffffff" />
        {/* Pupil */}
        <mesh position={[0, 0, 0.08]}>
          <sphereGeometry args={[0.06, 32, 32]} />
          <meshStandardMaterial color="#1a1a2e" />
        </mesh>
      </mesh>

      {/* Right eye */}
      <mesh ref={rightEyeRef} position={[0.15, 0.1, 0.85]}>
        <sphereGeometry args={[0.12, 32, 32]} />
        <meshStandardMaterial color="#ffffff" />
        {/* Pupil */}
        <mesh position={[0, 0, 0.08]}>
          <sphereGeometry args={[0.06, 32, 32]} />
          <meshStandardMaterial color="#1a1a2e" />
        </mesh>
      </mesh>

      {/* Mouth */}
      <mesh ref={mouthRef} position={[0, -0.25, 0.9]}>
        <capsuleGeometry args={[0.08, 0.15, 8, 16]} />
        <meshStandardMaterial color="#3730a3" />
      </mesh>

      {/* Glow effect */}
      <Sphere args={[1.15, 32, 32]} position={[0, 0, 0]}>
        <meshBasicMaterial
          color={headColor}
          transparent
          opacity={isSpeaking ? 0.15 : 0.08}
        />
      </Sphere>
    </group>
  );
};

interface Avatar3DProps {
  isSpeaking: boolean;
  isListening: boolean;
}

const Avatar3D = ({ isSpeaking, isListening }: Avatar3DProps) => {
  return (
    <motion.div
      className="relative w-64 h-64 md:w-72 md:h-72"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Outer glow rings */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle, hsl(217 91% 60% / 0.15) 0%, transparent 70%)",
        }}
        animate={{
          scale: isSpeaking ? [1, 1.15, 1] : isListening ? [1, 1.08, 1] : 1,
          opacity: isSpeaking ? [0.5, 0.8, 0.5] : isListening ? [0.3, 0.5, 0.3] : 0.3,
        }}
        transition={{
          duration: isSpeaking ? 0.6 : 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <Canvas
        camera={{ position: [0, 0, 3.5], fov: 50 }}
        style={{ borderRadius: "50%" }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <directionalLight position={[-5, -5, 5]} intensity={0.3} color="#8b5cf6" />
        <Environment preset="night" />
        <AvatarHead isSpeaking={isSpeaking} isListening={isListening} />
      </Canvas>

      {/* Status indicator */}
      <motion.div
        className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 rounded-full glass"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <motion.div
          className={`w-2 h-2 rounded-full ${
            isListening ? "bg-primary" : isSpeaking ? "bg-secondary" : "bg-muted-foreground"
          }`}
          animate={{
            scale: isListening || isSpeaking ? [1, 1.3, 1] : 1,
            opacity: isListening || isSpeaking ? [0.7, 1, 0.7] : 0.5,
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
          }}
        />
        <span className="text-xs text-muted-foreground">
          {isListening ? "Listening..." : isSpeaking ? "Speaking..." : "Ready"}
        </span>
      </motion.div>
    </motion.div>
  );
};

export default Avatar3D;
