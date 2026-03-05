function StatCards({ stats }) {
  const cards = [
    { title: "Total Content", value: stats.total_analyses },
    { title: "Avg Score", value: `${Number(stats.avg_score).toFixed(1)}%` },
    { title: "Reports", value: stats.total_analyses },
    { title: "This Week", value: stats.this_week },
  ];

  return (
    <div className="stat-cards">
      {cards.map((item, index) => (
        <div key={index} className="stat-card">
          <p className="stat-card-title">{item.title}</p>
          <h2 className="stat-card-value">{item.value}</h2>
        </div>
      ))}
    </div>
  );
}

export default StatCards;
