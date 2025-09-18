(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))i(e);new MutationObserver(e=>{for(const a of e)if(a.type==="childList")for(const n of a.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&i(n)}).observe(document,{childList:!0,subtree:!0});function r(e){const a={};return e.integrity&&(a.integrity=e.integrity),e.referrerPolicy&&(a.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?a.credentials="include":e.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function i(e){if(e.ep)return;e.ep=!0;const a=r(e);fetch(e.href,a)}})();class p{apiUrl=window.location.origin.includes("localhost:3000")?"http://localhost:8000":window.location.origin;constructor(){this.initializeUI(),this.loadSampleYields(),this.setupIncomeStream()}initializeUI(){document.querySelector("#app").innerHTML=`
      <div class="container">
        <h1>TIPS Bond Ladder Calculator</h1>

        <div class="form-section">
          <h2>Basic Parameters</h2>
          <div class="form-grid">
            <div class="form-group">
              <label for="current-age">Current Age:</label>
              <input type="number" id="current-age" value="54" min="1" max="100">
            </div>
            <div class="form-group">
              <label for="time-horizon">Time Horizon (years):</label>
              <input type="number" id="time-horizon" value="10" min="1" max="50">
            </div>
            <div class="form-group">
              <label for="current-year">Current Year:</label>
              <input type="number" id="current-year" value="${new Date().getFullYear()}" min="2020" max="2100">
            </div>
            <div class="form-group">
              <label for="current-month">Current Month:</label>
              <input type="number" id="current-month" value="${new Date().getMonth()+1}" min="1" max="12">
            </div>
            <div class="form-group">
              <label for="inflation-rate">Inflation Rate (%):</label>
              <input type="number" id="inflation-rate" value="3.0" step="0.1" min="0" max="20">
            </div>
            <div class="form-group">
              <label for="tax-rate">Tax Rate (%):</label>
              <input type="number" id="tax-rate" value="20.0" step="0.1" min="0" max="50">
            </div>
          </div>
        </div>

        <div class="form-section">
          <h2>Target Income Stream</h2>
          <div id="income-stream-container">
            <small>Target real income for each year in today's dollars</small>
          </div>
        </div>

        <div class="form-section">
          <h2>TIPS Yields</h2>
          <div id="yields-container">
            <small>Sample yields loaded. Modify as needed.</small>
          </div>
        </div>

        <div class="form-section">
          <button id="calculate-btn" class="calculate-btn">Calculate Ladder</button>
        </div>

        <div id="results-section" class="results-section" style="display: none;">
          <h2>Results</h2>
          <div id="summary-stats"></div>
          <div id="results-table"></div>
        </div>

        <div id="loading" class="loading" style="display: none;">
          Calculating...
        </div>

        <div id="error" class="error" style="display: none;"></div>
      </div>
    `,this.attachEventListeners()}attachEventListeners(){document.getElementById("calculate-btn").addEventListener("click",()=>this.calculateLadder()),document.getElementById("time-horizon").addEventListener("change",()=>this.updateIncomeStreamLength())}setupIncomeStream(){const t=parseInt(document.getElementById("time-horizon").value);this.renderIncomeStream(t)}updateIncomeStreamLength(){const t=parseInt(document.getElementById("time-horizon").value);this.renderIncomeStream(t)}renderIncomeStream(t){const r=document.getElementById("income-stream-container"),i=parseInt(document.getElementById("current-age").value),e=parseInt(document.getElementById("current-year").value),a=r.querySelectorAll('[id^="income-year-"]'),n={};a.forEach((s,o)=>{n[o]=s.value});const d=Array(t).fill(0).map((s,o)=>{const m=i+o,l=e+o,c=n[o]||"10";return`
        <div class="income-row">
          <label>Year ${l} (Age ${m}):</label>
          <div class="income-input-group">
            <span>$</span>
            <input type="number" id="income-year-${o}" value="${c}" min="0" step="0.01">
            <span>K</span>
          </div>
        </div>
      `}).join("");r.innerHTML=`
      <small>Target real income for each year in today's dollars</small>
      <div class="income-grid">
        ${d}
      </div>
    `}async loadSampleYields(){try{const r=await(await fetch(`${this.apiUrl}/sample-yields`)).json();this.displayYields(r)}catch(t){console.error("Failed to load sample yields:",t)}}displayYields(t){const r=document.getElementById("yields-container"),i=t.map((e,a)=>`
      <div class="yield-row">
        <label>Maturity ${e.maturity_years} years:</label>
        <input type="number" id="yield-${a}" value="${(e.yield_rate*100).toFixed(3)}" step="0.001" min="0" max="10">
        <span>%</span>
      </div>
    `).join("");r.innerHTML=i}collectFormData(){const t=parseInt(document.getElementById("current-age").value),r=parseInt(document.getElementById("time-horizon").value),i=parseInt(document.getElementById("current-year").value),e=parseInt(document.getElementById("current-month").value),a=parseFloat(document.getElementById("inflation-rate").value)/100,n=parseFloat(document.getElementById("tax-rate").value)/100,d=document.querySelectorAll('[id^="income-year-"]'),s=Array.from(d).map(l=>parseFloat(l.value)||0),o=[];return document.querySelectorAll('[id^="yield-"]').forEach((l,c)=>{const y=parseFloat(l.value)/100;o.push({maturity_years:.5+c*1,yield_rate:y})}),{current_age:t,time_horizon:r,current_year:i,current_month:e,start_year:i,start_month:e,target_income_stream:s,inflation_rate:a,tax_rate:n,tips_yields:o}}async calculateLadder(){const t=document.getElementById("loading"),r=document.getElementById("error"),i=document.getElementById("results-section");try{t.style.display="block",r.style.display="none",i.style.display="none";const e=this.collectFormData(),a=await fetch(`${this.apiUrl}/calculate-ladder`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)});if(!a.ok)throw new Error(`HTTP error! status: ${a.status}`);const n=await a.json();this.displayResults(n)}catch(e){r.textContent=`Error: ${e instanceof Error?e.message:"Unknown error"}`,r.style.display="block"}finally{t.style.display="none"}}displayResults(t){const r=document.getElementById("summary-stats"),i=document.getElementById("results-table"),e=document.getElementById("results-section");r.innerHTML=`
      <div class="summary-grid">
        <div class="summary-item">
          <label>Total Investment Required:</label>
          <span>$${t.total_investment_required.toFixed(2)}</span>
        </div>
        <div class="summary-item">
          <label>Total Real Income:</label>
          <span>$${t.total_real_income.toFixed(2)}</span>
        </div>
        <div class="summary-item">
          <label>Post-Tax Yield:</label>
          <span>${(t.post_tax_yield*100).toFixed(3)}%</span>
        </div>
      </div>
    `;const a=`
      <table class="results-table">
        <thead>
          <tr>
            <th>Age</th>
            <th>Year</th>
            <th>Target Income</th>
            <th>Real Rate</th>
            <th>Investment Today</th>
            <th>Real Post-Tax Income</th>
            <th>Taxes</th>
          </tr>
        </thead>
        <tbody>
          ${t.steps.map(n=>`
            <tr>
              <td>${n.age}</td>
              <td>${n.year}</td>
              <td>$${n.target_income.toFixed(2)}</td>
              <td>${(n.real_interest_rate*100).toFixed(3)}%</td>
              <td>$${n.ladder_amount_today.toFixed(2)}</td>
              <td>$${n.real_posttax_income.toFixed(2)}</td>
              <td>$${n.taxes.toFixed(2)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;i.innerHTML=a,e.style.display="block"}}new p;
