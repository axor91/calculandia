import CalculatorPage, {
  createCalculatorMetadata,
} from "../_components/CalculatorPage";
export const metadata = createCalculatorMetadata("srednee-znachenie");
export default function Page() {
  return <CalculatorPage slug="srednee-znachenie" />;
}
