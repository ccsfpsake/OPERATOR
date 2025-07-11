import styles from './search.module.css'
import { MdSearch } from "react-icons/md"

const Search = ({ placeholder, value, onChange }) => {

  return (
    <div className={styles.container}>
      <MdSearch />
      <input
        type="text"
        placeholder={placeholder}
        className={styles.input}
        value={value} 
        onChange={onChange} 
      />
    </div>
  );
}

export default Search;
