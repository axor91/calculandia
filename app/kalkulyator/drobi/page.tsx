import CalculatorPage, {
  createCalculatorMetadata,
} from "../_components/CalculatorPage";
export const metadata = createCalculatorMetadata("drobi");
export default function Page() {
  return <CalculatorPage slug="drobi" />;
}
