import CategoryPage, {
  createCategoryMetadata,
} from "../_components/CategoryPage";
const category = "matematika";
export const metadata = createCategoryMetadata(category);
export default function Page() {
  return <CategoryPage id={category} />;
}
