import CalculatorPage, {
  createCalculatorMetadata,
} from "../_components/CalculatorPage";
export const metadata = createCalculatorMetadata("vozrast");
export default function Page() {
  return <CalculatorPage slug="vozrast" />;
}
