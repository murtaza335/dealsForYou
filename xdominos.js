

async function fetchDeals() {
  try {
    const url = "https://www.dominos.com.pk/api/menu/menudata";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "origin": "https://www.dominos.com.pk",
        "referer": "https://www.dominos.com.pk/"
      },
      body: JSON.stringify({
        body: "U2FsdGVkX197Ze4kW9rY5vRnb9y1f4MoTTAbHPlCyEq8BHb3cSUMrQbBtWzw1MA8Wm5P/Zpq68xujm1y31WlFE2pa9031vxMS13Dh7bS59w="
      })
    });

    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

    const result = await response.json();

    const menuData = result?.menu?.menuData || [];

    // ✅ Step 1: Filter only Deals (group_id === 11)
    const dealsGroups = menuData.filter(item => item.group_id === 11);

    // ✅ Step 2: Extract only those having actual data
    const allDeals = dealsGroups
      .filter(item => Array.isArray(item.data) && item.data.length > 0)
      .flatMap(item =>
        item.data.map(deal => ({
          combo_id: deal.combo_id,
          name: deal.combo_name,
          description: deal.combo_description,
          price: deal.combo_mrp_price,
          image: deal.image_url,
          sub_group_name: item.sub_group_name
        }))
      );

    console.log("✅ Total deals:", allDeals.length);
    console.log(allDeals);

  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

fetchDeals();