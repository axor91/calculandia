import CalculatorPage, {
  createCalculatorMetadata,
} from "../_components/CalculatorPage";
export const metadata = createCalculatorMetadata("plitka");
export default function Page() {
  return <CalculatorPage slug="plitka" />;
}
