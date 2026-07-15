import CategoryPage, {
  createCategoryMetadata,
} from "../_components/CategoryPage";
const category = "finansy";
export const metadata = createCategoryMetadata(category);
export default function Page() {
  return <CategoryPage id={category} />;
}
