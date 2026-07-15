import CalculatorPage, {
  createCalculatorMetadata,
} from "../_components/CalculatorPage";

const slug = "days";

export const metadata = createCalculatorMetadata(slug);

export default function Page() {
  return <CalculatorPage slug={slug} />;
}
