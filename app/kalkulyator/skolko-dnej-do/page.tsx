import CalculatorPage, {
  createCalculatorMetadata,
} from "../_components/CalculatorPage";
export const metadata = createCalculatorMetadata("skolko-dnej-do");
export default function Page() {
  return <CalculatorPage slug="skolko-dnej-do" />;
}
