"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { reportClientError } from "@/lib/report-client-error";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
  /** Название области, чтобы пользователь видел, ЧТО сломалось */
  label?: string;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

/**
 * (#55) Полноценный React Error Boundary.
 * Оборачиваем компоненты калькуляторов, чтобы ошибка в одном
 * не роняла всю страницу.
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    reportClientError({
      source: "calculator_boundary",
      context: this.props.label || "calculator",
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="bg-red-50 border-2 border-red-300 p-6 text-center">
          <div className="text-red-800 font-semibold text-base mb-2">
            {this.props.label
              ? `Ошибка в «${this.props.label}»`
              : "Произошла ошибка"}
          </div>
          <p className="text-red-600 text-sm mb-4">
            Расчёт временно недоступен. Повторите попытку или сбросьте введённые
            значения.
          </p>
          <button
            onClick={this.handleRetry}
            className="px-4 py-2 text-sm border-2 border-red-600 text-red-700 hover:bg-red-100 transition-colors"
          >
            Попробовать снова
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
