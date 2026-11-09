/**
 * Immutable, rerunnable WidgetPhi build branch identity.
 * Each GitHub Actions run/attempt gets a new branch; we never force-push an
 * earlier owner's card proposal just because a scheduled job runs again.
 */
function positiveInteger(value){
 const text=String(value??'');
 if(!/^[1-9]\d{0,15}$/.test(text))return null;
 const number=Number(text);
 return Number.isSafeInteger(number)&&number>0?number:null;
}
export function createCardBuildBranch({issueNumber,runId,attempt}={}){
 const issue=positiveInteger(issueNumber),run=positiveInteger(runId),tryNumber=positiveInteger(attempt);
 if(!issue||!run||!tryNumber)throw Error('invalid_card_build_identity');
 return 'bot/card-build-issue-'+issue+'-run-'+run+'-attempt-'+tryNumber;
}
export function parseCardBuildBranch(ref){
 const match=/^bot\/card-build-issue-([1-9]\d{0,15})(?:-run-([1-9]\d{0,15})-attempt-([1-9]\d{0,15}))?$/.exec(String(ref||''));
 if(!match)return null;
 const issueNumber=positiveInteger(match[1]),runId=match[2]?positiveInteger(match[2]):null,attempt=match[3]?positiveInteger(match[3]):null;
 if(!issueNumber||match[2]&&(!runId||!attempt))return null;
 return {issueNumber,runId,attempt,legacy:!match[2]};
}
