import {
    ask,
    checkbox,
    getCommitMessage,
    gitAdd,
    gitCommit,
    gitUntracked,
    logger,
} from "@/help";

export default async function () {
    const untracked = await gitUntracked();
    if (untracked.length > 0) {
        const answer = await checkbox("这些新文件是否加入暂存？", untracked);
        if (answer.length > 0) {
            await gitAdd(answer)
        }
    }
    const message = await getCommitMessage();
    const answer = await ask(message);
    if (answer) {
        await gitCommit(message);
    } else {
        logger.info("取消提交");
    }

}
