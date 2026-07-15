import CalculatorPage, {
  createCalculatorMetadata,
} from "../_components/CalculatorPage";
export const metadata = createCalculatorMetadata("dosrochnoe-pogashenie");
export default function Page() {
  return <CalculatorPage slug="dosrochnoe-pogashenie" />;
}
