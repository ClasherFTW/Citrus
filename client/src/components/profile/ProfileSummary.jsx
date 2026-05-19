import { Link } from "react-router-dom";
import { formatRelativeTime, truncateText } from "../../utils/formatters";
import { markdownToText } from "../../utils/markdown";

function ProfileSummary({
  profile,
  questions,
  answers,
  isLoadingQuestions,
  isLoadingAnswers,
  avatarActions = null,
}) {
  const avatarUrl = String(profile.avatarUrl || "").trim();
  const fallbackInitial = String(profile.username || "?").trim().charAt(0).toUpperCase() || "?";

  return (
    <>
      <section className="content-panel profile-head">
        <div className="profile-head__identity">
          <div className="profile-avatar" aria-label={`${profile.username} avatar`}>
            {avatarUrl ? (
              <img src={avatarUrl} alt={`${profile.username} avatar`} />
            ) : (
              <span>{fallbackInitial}</span>
            )}
          </div>

          <div className="profile-head__meta">
            <h2>{profile.username}</h2>
            <p>{profile.bio || "No bio added yet."}</p>
          </div>
        </div>

        {avatarActions}

        <div className="stats-strip compact">
          <div>
            <strong>{profile.reputation ?? 0}</strong>
            <span>reputation</span>
          </div>
          <div>
            <strong>{profile.stats?.questionCount ?? 0}</strong>
            <span>questions</span>
          </div>
          <div>
            <strong>{profile.stats?.answerCount ?? 0}</strong>
            <span>answers</span>
          </div>
          <div>
            <strong>{profile.role}</strong>
            <span>role</span>
          </div>
        </div>

        <div className="tag-row">
          {(profile.stats?.topTags || []).map((tag) => (
            <span key={tag.tag} className="tag-chip">
              {tag.tag} ({tag.count})
            </span>
          ))}
        </div>
      </section>

      <section className="profile-grid">
        <section className="content-panel">
          <h3>Recent Questions</h3>

          {isLoadingQuestions ? <p className="muted">Loading questions...</p> : null}

          {!isLoadingQuestions && questions.length === 0 ? (
            <p className="muted">No recent questions.</p>
          ) : null}

          {questions.map((question) => (
            <article key={question._id} className="mini-post">
              <h4>
                <Link to={`/app/questions/${question._id}`}>{question.title}</Link>
              </h4>
              <p>{truncateText(markdownToText(question.description), 110)}</p>
              <small>{formatRelativeTime(question.createdAt)}</small>
            </article>
          ))}
        </section>

        <section className="content-panel">
          <h3>Recent Answers</h3>

          {isLoadingAnswers ? <p className="muted">Loading answers...</p> : null}

          {!isLoadingAnswers && answers.length === 0 ? (
            <p className="muted">No recent answers found in latest threads.</p>
          ) : null}

          {answers.map((answer) => (
            <article key={answer._id} className="mini-post">
              <h4>
                <Link to={`/app/questions/${answer.questionId}`}>{answer.questionTitle}</Link>
              </h4>
              <p>{truncateText(markdownToText(answer.content), 120)}</p>
              <small>{formatRelativeTime(answer.createdAt)}</small>
            </article>
          ))}
        </section>
      </section>
    </>
  );
}

export default ProfileSummary;
