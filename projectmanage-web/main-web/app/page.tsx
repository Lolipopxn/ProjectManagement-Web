import axios from 'axios';

const fetchdata = async () => {
  try {
    const response = await axios.get(`${process.env.STRAPI_BASE_URL}/api/projects`);
    return response.data.data;
    
  } catch(error){
    console.error("Error:", error);
  }
}

export default async function Home() {
  const data = await fetchdata();
  return (
    <div>
      <div>Home Test</div>
      {data.map((item: any) => (
        <div key={item.id}>
          <h2>Id : {item.project_name}</h2>
          <h2>Description : {item.description}</h2>
        </div>
      ))}
    </div>
  );
}
