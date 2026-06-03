import { useState } from "react";

function AnswerSheet() {
  const questions = Array.from(
    { length: 10 },
    (_, i) => i + 1
  );

  const [answers, setAnswers] = useState({});

  return (
    <div>
      <h1>確認テスト</h1>

      {questions.map((q) => (
        <div key={q}>
          <p>問題 {q}</p>

          {[1, 2, 3, 4].map((choice) => (
            <label
              key={choice}
              style={{ marginRight: "20px" }}
            >
              <input
                type="radio"
                name={`q${q}`}
                value={choice}
                onChange={() =>
                  setAnswers({
                    ...answers,
                    [q]: choice,
                  })
                }
              />

              {choice}
            </label>
          ))}
        </div>
      ))}

      <pre>
        {JSON.stringify(
          answers,
          null,
          2
        )}
      </pre>
    </div>
  );
}

export default AnswerSheet;