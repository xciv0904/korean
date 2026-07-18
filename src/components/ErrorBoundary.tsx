import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// 全域錯誤防護:React元件執行期間如果丟出例外(例如某句資料格式壞掉、
// 某個元件邏輯有 bug),預設會讓整個 App 變成一片空白,使用者完全不知道
// 發生什麼事。這裡包一層 Error Boundary,壞掉時顯示簡單的錯誤畫面 +
// 「重新整理」按鈕,不會整頁空白卡死。注意:錄音/SRS 資料存在 IndexedDB,
// 不會因為畫面重新整理而遺失。
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("App crashed:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <p className="error-boundary__title">畫面發生錯誤</p>
          <p className="error-boundary__hint">
            練習紀錄跟錄音都存在裝置本機,不會因此遺失,重新整理應該就能恢復正常。
          </p>
          <button
            type="button"
            className="error-boundary__button"
            onClick={() => window.location.reload()}
          >
            重新整理
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
