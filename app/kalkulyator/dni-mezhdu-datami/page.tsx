import CalculatorPage, {
  createCalculatorMetadata,
} from "../_components/CalculatorPage";
export const metadata = createCalculatorMetadata("dni-mezhdu-datami");
export default function Page() {
  return <CalculatorPage slug="dni-mezhdu-datami" />;
}
