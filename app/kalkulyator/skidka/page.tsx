import CalculatorPage, {
  createCalculatorMetadata,
} from "../_components/CalculatorPage";
export const metadata = createCalculatorMetadata("skidka");
export default function Page() {
  return <CalculatorPage slug="skidka" />;
}
