import expect from "expect";

import { createStorageTestSuite } from "../../../tests/storage-tests";

createStorageTestSuite("Activity Following storage", ({ it }) => {
  it(
    "should be able to follow an entity",
    { withTestUser: true },
    async ({ storage, services }) => {
      const { activityFollowing } = storage.serverModules;
      const userReference = services.auth.getCurrentUserReference()!;
      const createdWhen = new Date();

      // TODO: Create shared list to follow
      const sharedList = "test";

      expect(
        await storage.serverStorageManager
          .collection("activityFollow")
          .findObject({ collection: sharedList, objectId: sharedList })
      ).toEqual(null);

      const follow = await activityFollowing.followEntity({
        collection: sharedList,
        objectId: sharedList,
        userReference,
        createdWhen,
      });

      expect(
        await storage.serverStorageManager
          .collection("activityFollow")
          .findObject({ id: follow.id })
      ).toEqual(follow);
    }
  );

  it(
    "should be able to unfollow an entity",
    { withTestUser: true },
    async ({ storage, services }) => {
      const { activityFollowing } = storage.serverModules;
      const userReference = services.auth.getCurrentUserReference()!;
      const createdWhen = new Date();

      // TODO: Create shared list to follow
      const sharedList = "test";

      const follow = await activityFollowing.followEntity({
        collection: sharedList,
        objectId: sharedList,
        userReference,
        createdWhen,
      });

      expect(
        await storage.serverStorageManager
          .collection("activityFollow")
          .findObject({ id: follow.id })
      ).toEqual(follow);

      await activityFollowing.unfollowEntity({
        collection: sharedList,
        objectId: sharedList,
        userReference,
      });

      expect(
        await storage.serverStorageManager
          .collection("activityFollow")
          .findObject({ id: follow.id })
      ).toEqual({});
    }
  );

  it("should be able to get all followers for an entity", async () => {
    // TODO: Create multiple users

    expect(1).toBe(2);
  });

  it(
    "should be able to check whether an entity is being followed by a user",
    { withTestUser: true },
    async ({ storage, services }) => {
      const { activityFollowing } = storage.serverModules;
      const userReference = services.auth.getCurrentUserReference()!;
      const createdWhen = new Date();

      // TODO: Create shared list to follow
      const sharedList = "test";

      expect(
        await activityFollowing.isEntityFollowedByUser({
          objectId: sharedList,
          collection: sharedList,
          userReference,
        })
      ).toBe(false);

      await activityFollowing.followEntity({
        collection: sharedList,
        objectId: sharedList,
        userReference,
        createdWhen,
      });

      expect(
        await activityFollowing.isEntityFollowedByUser({
          objectId: sharedList,
          collection: sharedList,
          userReference,
        })
      ).toBe(true);
    }
  );

  it("should be able to get all follows of specific types", async () => {
    expect(1).toBe(2);
  });

  it("should be able to get all follows of specific collection", async () => {
    // TODO: Create multiple users
    expect(1).toBe(2);
  });
});
