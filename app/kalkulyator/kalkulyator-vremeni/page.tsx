import CalculatorPage, {
  createCalculatorMetadata,
} from "../_components/CalculatorPage";
export const metadata = createCalculatorMetadata("kalkulyator-vremeni");
export default function Page() {
  return <CalculatorPage slug="kalkulyator-vremeni" />;
}
