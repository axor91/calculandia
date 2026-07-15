import CalculatorPage, {
  createCalculatorMetadata,
} from "../_components/CalculatorPage";
export const metadata = createCalculatorMetadata("pribavit-k-date");
export default function Page() {
  return <CalculatorPage slug="pribavit-k-date" />;
}
