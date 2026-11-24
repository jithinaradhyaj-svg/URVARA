function PriceChart() {
  return (
    <div className="section-inner">
      <h2 className="section-title">Price Trend Charts</h2>
      <p className="section-subtitle">Historical price charts need dated observations for the same commodity and market over time.</p>
      <div className="market-message" role="status">
        <strong>Historical charts are not available yet.</strong>
        <span>The connected data.gov.in resource is a current daily market feed. Its returned total counts market observations, not historical dates, and the verified response so far does not establish a complete time series. URVARA will not turn current rows into a trend chart.</span>
      </div>
      <section className="market-source-note" aria-labelledby="history-source-heading">
        <strong id="history-source-heading">What Stage 3.2 will need</strong>
        <span>A separate government resource or historical API endpoint with multiple dated records per market and commodity, plus confirmed coverage dates and units. Any historical feed must be verified before a chart is enabled.</span>
        <a href="https://www.data.gov.in/catalog/current-daily-price-various-commodities-various-markets-mandi" target="_blank" rel="noreferrer">View the current daily resource description</a>
      </section>
    </div>
  )
}

export default PriceChart
