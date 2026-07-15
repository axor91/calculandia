import CalculatorPage, {
  createCalculatorMetadata,
} from "../_components/CalculatorPage";
export const metadata = createCalculatorMetadata("ipoteka");
export default function Page() {
  return <CalculatorPage slug="ipoteka" />;
}
