import './style.css'

interface TipsYield {
  maturity_years: number;
  yield_rate: number;
}

interface LadderInput {
  current_age: number;
  time_horizon: number;
  current_year: number;
  current_month: number;
  start_year: number;
  start_month: number;
  target_income_stream: number[];
  inflation_rate: number;
  tax_rate: number;
  tips_yields: TipsYield[];
}

interface LadderStep {
  age: number;
  year: number;
  target_income: number;
  real_interest_rate: number;
  ladder_amount_today: number;
  real_posttax_income: number;
  taxes: number;
}

interface LadderResult {
  steps: LadderStep[];
  total_investment_required: number;
  total_real_income: number;
  post_tax_yield: number;
}

class TipsLadderApp {
  private apiUrl = window.location.origin.includes('localhost:3000')
    ? 'http://localhost:8000'
    : window.location.origin;

  constructor() {
    this.initializeUI();
    this.loadSampleYields();
    this.setupIncomeStream();
  }

  private initializeUI() {
    document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
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
              <input type="number" id="current-month" value="${new Date().getMonth() + 1}" min="1" max="12">
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
    `;

    this.attachEventListeners();
  }

  private attachEventListeners() {
    const calculateBtn = document.getElementById('calculate-btn')!;
    calculateBtn.addEventListener('click', () => this.calculateLadder());

    const timeHorizonInput = document.getElementById('time-horizon')! as HTMLInputElement;
    timeHorizonInput.addEventListener('change', () => this.updateIncomeStreamLength());
  }

  private setupIncomeStream() {
    const timeHorizon = parseInt((document.getElementById('time-horizon')! as HTMLInputElement).value);
    this.renderIncomeStream(timeHorizon);
  }

  private updateIncomeStreamLength() {
    const timeHorizon = parseInt((document.getElementById('time-horizon')! as HTMLInputElement).value);
    this.renderIncomeStream(timeHorizon);
  }

  private renderIncomeStream(timeHorizon: number) {
    const container = document.getElementById('income-stream-container')!;
    const currentAge = parseInt((document.getElementById('current-age')! as HTMLInputElement).value);
    const currentYear = parseInt((document.getElementById('current-year')! as HTMLInputElement).value);

    // Get existing values if any
    const existingInputs = container.querySelectorAll('[id^="income-year-"]');
    const existingValues: {[key: number]: string} = {};
    existingInputs.forEach((input, index) => {
      existingValues[index] = (input as HTMLInputElement).value;
    });

    const incomeHtml = Array(timeHorizon).fill(0).map((_, i) => {
      const age = currentAge + i;
      const year = currentYear + i;
      const value = existingValues[i] || '10';

      return `
        <div class="income-row">
          <label>Year ${year} (Age ${age}):</label>
          <div class="income-input-group">
            <span>$</span>
            <input type="number" id="income-year-${i}" value="${value}" min="0" step="0.01">
            <span>K</span>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <small>Target real income for each year in today's dollars</small>
      <div class="income-grid">
        ${incomeHtml}
      </div>
    `;
  }

  private async loadSampleYields() {
    try {
      const response = await fetch(`${this.apiUrl}/sample-yields`);
      const yields = await response.json();
      this.displayYields(yields);
    } catch (error) {
      console.error('Failed to load sample yields:', error);
    }
  }

  private displayYields(yields: TipsYield[]) {
    const container = document.getElementById('yields-container')!;
    const yieldsHtml = yields.map((y, index) => `
      <div class="yield-row">
        <label>Maturity ${y.maturity_years} years:</label>
        <input type="number" id="yield-${index}" value="${(y.yield_rate * 100).toFixed(3)}" step="0.001" min="0" max="10">
        <span>%</span>
      </div>
    `).join('');

    container.innerHTML = yieldsHtml;
  }

  private collectFormData(): LadderInput {
    const currentAge = parseInt((document.getElementById('current-age')! as HTMLInputElement).value);
    const timeHorizon = parseInt((document.getElementById('time-horizon')! as HTMLInputElement).value);
    const currentYear = parseInt((document.getElementById('current-year')! as HTMLInputElement).value);
    const currentMonth = parseInt((document.getElementById('current-month')! as HTMLInputElement).value);
    const inflationRate = parseFloat((document.getElementById('inflation-rate')! as HTMLInputElement).value) / 100;
    const taxRate = parseFloat((document.getElementById('tax-rate')! as HTMLInputElement).value) / 100;

    const incomeInputs = document.querySelectorAll('[id^="income-year-"]');
    const incomeStream = Array.from(incomeInputs).map(input =>
      parseFloat((input as HTMLInputElement).value) || 0
    );

    const yields: TipsYield[] = [];
    const yieldInputs = document.querySelectorAll('[id^="yield-"]');
    yieldInputs.forEach((input, index) => {
      const yieldValue = parseFloat((input as HTMLInputElement).value) / 100;
      yields.push({
        maturity_years: 0.5 + index * 1.0, // Approximate maturity mapping
        yield_rate: yieldValue
      });
    });

    return {
      current_age: currentAge,
      time_horizon: timeHorizon,
      current_year: currentYear,
      current_month: currentMonth,
      start_year: currentYear,
      start_month: currentMonth,
      target_income_stream: incomeStream,
      inflation_rate: inflationRate,
      tax_rate: taxRate,
      tips_yields: yields
    };
  }

  private async calculateLadder() {
    const loadingEl = document.getElementById('loading')!;
    const errorEl = document.getElementById('error')!;
    const resultsEl = document.getElementById('results-section')!;

    try {
      loadingEl.style.display = 'block';
      errorEl.style.display = 'none';
      resultsEl.style.display = 'none';

      const input = this.collectFormData();

      const response = await fetch(`${this.apiUrl}/calculate-ladder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: LadderResult = await response.json();
      this.displayResults(result);

    } catch (error) {
      errorEl.textContent = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errorEl.style.display = 'block';
    } finally {
      loadingEl.style.display = 'none';
    }
  }

  private displayResults(result: LadderResult) {
    const summaryEl = document.getElementById('summary-stats')!;
    const tableEl = document.getElementById('results-table')!;
    const resultsEl = document.getElementById('results-section')!;

    summaryEl.innerHTML = `
      <div class="summary-grid">
        <div class="summary-item">
          <label>Total Investment Required:</label>
          <span>$${result.total_investment_required.toFixed(2)}</span>
        </div>
        <div class="summary-item">
          <label>Total Real Income:</label>
          <span>$${result.total_real_income.toFixed(2)}</span>
        </div>
        <div class="summary-item">
          <label>Post-Tax Yield:</label>
          <span>${(result.post_tax_yield * 100).toFixed(3)}%</span>
        </div>
      </div>
    `;

    const tableHtml = `
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
          ${result.steps.map(step => `
            <tr>
              <td>${step.age}</td>
              <td>${step.year}</td>
              <td>$${step.target_income.toFixed(2)}</td>
              <td>${(step.real_interest_rate * 100).toFixed(3)}%</td>
              <td>$${step.ladder_amount_today.toFixed(2)}</td>
              <td>$${step.real_posttax_income.toFixed(2)}</td>
              <td>$${step.taxes.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    tableEl.innerHTML = tableHtml;
    resultsEl.style.display = 'block';
  }
}

new TipsLadderApp();
