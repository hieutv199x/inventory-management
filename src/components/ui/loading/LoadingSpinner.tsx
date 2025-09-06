"use client";
import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  color?: "primary" | "white" | "gray" | "blue" | "green" | "red";
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  className,
  color = "primary"
}) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8",
    xl: "h-12 w-12"
  };

  const colorClasses = {
    primary: "text-blue-600",
    white: "text-white",
    gray: "text-gray-400",
    blue: "text-blue-500",
    green: "text-green-500",
    red: "text-red-500"
  };

  const classes = [
    "animate-spin",
    sizeClasses[size],
    colorClasses[color],
    className
  ].filter(Boolean).join(" ");

  return (
    <Loader2 className={classes} />
  );
};

export default LoadingSpinner;
