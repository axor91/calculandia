import CalculatorPage, {
  createCalculatorMetadata,
} from "../_components/CalculatorPage";
export const metadata = createCalculatorMetadata("refinansirovanie");
export default function Page() {
  return <CalculatorPage slug="refinansirovanie" />;
}
