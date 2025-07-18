import React from "react";
import styles from "./button.module.css";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
  as?: React.ElementType;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "default", asChild = false, as: CompProp, ...props }, ref) => {
    const classes = [
      styles.button,
      styles[variant],
      styles[size],
      className
    ].filter(Boolean).join(" ");
    const Comp: React.ElementType = asChild && CompProp ? CompProp : "button";
    return (
      <Comp ref={ref} className={classes} {...props} />
    );
  }
);
Button.displayName = "Button";

export { Button }; 