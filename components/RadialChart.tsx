import React, { useEffect, useRef } from 'react';
import { motion, useSpring, useTransform, animate } from 'framer-motion';

interface RadialChartProps {
    score: number;
}

export const RadialChart: React.FC<RadialChartProps> = ({ score }) => {
    const size = 100;
    const strokeWidth = 10;
    const center = size / 2;
    const radius = size / 2 - strokeWidth / 2;
    const circumference = 2 * Math.PI * radius;

    const progress = useSpring(0, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001,
    });
    const strokeColor = useTransform(progress, [0, 40, 75, 100], ['#ef4444', '#f59e0b', '#22d3ee', '#67e8f9']);
    const strokeDashoffset = useTransform(progress, (p) => circumference * (1 - p / 100));

    const countRef = useRef<HTMLParagraphElement>(null);
    
    useEffect(() => {
        progress.set(score);
        
        const node = countRef.current;
        if (node) {
            const controls = animate(0, score, {
                duration: 1.5,
                ease: "circOut",
                onUpdate(value) {
                    node.textContent = Math.round(value).toString();
                }
            });
            return () => controls.stop();
        }

    }, [score, progress]);

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {/* Background Circle */}
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="transparent"
                    stroke="#1e293b" // slate-800
                    strokeWidth={strokeWidth}
                />
                {/* Progress Circle */}
                <motion.circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="transparent"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${center} ${center})`}
                    strokeDasharray={circumference}
                    style={{
                        stroke: strokeColor,
                        strokeDashoffset: strokeDashoffset,
                    }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                 <p ref={countRef} className="text-3xl font-bold text-slate-100">0</p>
                 <p className="text-xs text-slate-400 -mt-1">%</p>
            </div>
        </div>
    );
};
