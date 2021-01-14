import StorageManager from "@worldbrain/storex";
import {
  StorageModule,
  StorageModuleConfig,
  StorageModuleConstructorArgs,
} from "@worldbrain/storex-pattern-modules";
import { UserReference } from "@worldbrain/memex-common/lib/web-interface/types/users";

export interface ActivityFollow {
  id: string;
  objectId: string;
  collection: string;
  user: string;
  createdWhen: number;
}

interface FollowEntityArgs {
  objectId: string;
  collection: string;
  userReference: UserReference;
}

export default class ActivityFollowingStorage extends StorageModule {
  private storageManager: StorageManager;

  constructor(options: StorageModuleConstructorArgs) {
    super(options);

    this.storageManager = options.storageManager;
  }

  getConfig = (): StorageModuleConfig => ({
    collections: {
      activityFollow: {
        version: new Date("2021-01-14"), // TODO: Work out where this should be
        fields: {
          id: { type: "string" },
          objectId: { type: "string" },
          collection: { type: "string" },
          createdWhen: { type: "timestamp" },
        },
        indices: [{ field: "id", pk: true }],
        relationships: [{ alias: "creator", childOf: "user" }],
      },
    },
    operations: {
      createFollow: {
        operation: "createObject",
        collection: "activityFollow",
      },
      deleteFollow: {
        operation: "deleteObject",
        collection: "activityFollow",
        args: {
          id: "$id:pk",
        },
      },
      findFollow: {
        operation: "findObject",
        collection: "activityFollow",
        args: {
          collection: "$collection:string",
          objectId: "$objectId:string",
          user: "$userId:string",
        },
      },
      findFollowsByUser: {
        operation: "findObjects",
        collection: "activityFollow",
        args: {
          collection: "$collection:string",
          user: "$userId:string",
        },
      },
      findFollowsByCollection: {
        operation: "findObjects",
        collection: "activityFollow",
        args: {
          collection: "$collection:string",
          objectId: "$objectId:string",
        },
      },
    },
  });

  async followEntity({
    objectId,
    collection,
    userReference: { id: userId },
    createdWhen = new Date(),
  }: FollowEntityArgs & { createdWhen?: Date }): Promise<ActivityFollow> {
    const foundFollow = await this.operation("findFollow", {
      collection,
      userId,
    });
    if (foundFollow) {
      return foundFollow;
    }

    return (
      await this.operation("createFollow", {
        objectId,
        collection,
        user: userId,
        createdWhen: createdWhen.getTime(),
      })
    ).object;
  }

  async unfollowEntity({
    objectId,
    collection,
    userReference: { id: userId },
  }: FollowEntityArgs): Promise<void> {
    const foundFollow = await this.operation("findFollow", {
      collection,
      objectId,
      userId,
    });

    if (foundFollow) {
      await this.operation("deleteFollow", { id: foundFollow.id });
    }
  }

  async isEntityFollowedByUser({
    objectId,
    collection,
    userReference: { id: userId },
  }: FollowEntityArgs): Promise<boolean> {
    const foundFollow = await this.operation("findFollow", {
      collection,
      objectId,
      userId,
    });

    return !!foundFollow;
  }

  async getAllEntityFollowers(args: {
    collection: string;
    objectId: string;
  }): Promise<UserReference[]> {
    const follows = await this.getAllFollowsByCollection(args);

    return follows.map((follow) => ({
      id: follow.user,
      type: "user-reference",
    }));
  }

  async getAllFollowsByUser({
    collection,
    user: { id: userId },
  }: {
    user: UserReference;
    collection: string;
  }): Promise<ActivityFollow[]> {
    const follows: ActivityFollow[] = await this.operation(
      "findFollowsByUser",
      { collection, userId }
    );

    return follows;
  }

  async getAllFollowsByCollection({
    collection,
    objectId,
  }: {
    objectId: string;
    collection: string;
  }): Promise<ActivityFollow[]> {
    const follows: ActivityFollow[] = await this.operation(
      "findFollowsByCollection",
      { collection, objectId }
    );

    return follows;
  }
}
