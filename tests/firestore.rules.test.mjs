import { before, after, beforeEach, test } from "node:test";
import { readFile } from "node:fs/promises";
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from "@firebase/rules-unit-testing";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";
let env;
before(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-aisle",
    firestore: {
      host: "127.0.0.1",
      port: 8080,
      rules: await readFile("firestore.rules", "utf8"),
    },
  });
});
beforeEach(async () => {
  await env.clearFirestore();
});
after(async () => {
  await env?.cleanup();
});
const state = (db, uid) => doc(db, "users", uid, "shopping", "state");
const payload = () => ({
  cart: { 100: 1 },
  favorites: [101],
  updatedAt: serverTimestamp(),
});
const verified = (uid) =>
  env
    .authenticatedContext(uid, {
      email: `${uid}@example.test`,
      email_verified: true,
    })
    .firestore();
test('Firebase anonymous demo accounts may access only their own validated shopping and lists', async () => {
  const demo = env.authenticatedContext('demo-a',{firebase:{sign_in_provider:'anonymous'}}).firestore();
  const other = env.authenticatedContext('demo-b',{firebase:{sign_in_provider:'anonymous'}}).firestore();
  await assertSucceeds(setDoc(state(demo,'demo-a'),payload()));
  await assertSucceeds(getDoc(state(demo,'demo-a')));
  await assertFails(getDoc(state(other,'demo-a')));
  await assertFails(setDoc(state(demo,'alice'),payload()));
  await assertFails(setDoc(state(demo,'demo-a'),{...payload(),cart:{100:999}}));
  const list=doc(demo,'users','demo-a','lists','ideas');
  await assertSucceeds(setDoc(list,{name:'Demo ideas',products:[100],updatedAt:serverTimestamp()}));
  await assertSucceeds(getDocs(collection(demo,'users','demo-a','lists')));
  await assertFails(getDoc(doc(other,'users','demo-a','lists','ideas')));
  await assertFails(getDocs(collection(other,'users','demo-a','lists')));
  await assertFails(setDoc(doc(demo,'users','demo-a','orders','fake'),{paid:true}));
});
test("verified owner may write and read own shopping state", async () => {
  const db = verified("alice");
  await assertSucceeds(setDoc(state(db, "alice"), payload()));
  await assertSucceeds(getDoc(state(db, "alice")));
});
test("a second account cannot read or write the first account even with a guessed UID", async () => {
  await assertSucceeds(setDoc(state(verified("alice"), "alice"), payload()));
  const bob = verified("bob");
  await assertFails(getDoc(state(bob, "alice")));
  await assertFails(setDoc(state(bob, "alice"), payload()));
});
test("unauthenticated guests and unverified email users cannot access shopping state", async () => {
  const anon = env.unauthenticatedContext().firestore();
  const unverified = env
    .authenticatedContext("alice", { email_verified: false })
    .firestore();
  await assertFails(getDoc(state(anon, "alice")));
  await assertFails(setDoc(state(anon, "alice"), payload()));
  await assertFails(getDoc(state(unverified, "alice")));
  await assertFails(setDoc(state(unverified, "alice"), payload()));
});
test("invalid products, stock overflow, forged timestamps and additional fields are rejected", async () => {
  const db = verified("alice");
  for (const data of [
    { ...payload(), cart: { 999: 1 } },
    { ...payload(), cart: { 101: 13 } },
    { ...payload(), cart: { 100: -1 } },
    { ...payload(), cart: { 100: 1.5 } },
    { ...payload(), favorites: [999] },
    { ...payload(), updatedAt: new Date(0) },
    { ...payload(), isAdmin: true },
  ])
    await assertFails(setDoc(state(db, "alice"), data));
});
test("user listing and manufactured paid orders are denied", async () => {
  const db = verified("alice");
  await assertFails(getDocs(collection(db, "users")));
  await assertFails(
    setDoc(doc(db, "orders", "fake"), {
      userId: "alice",
      status: "paid",
      amount: 1,
    }),
  );
});
test("verified owners can manage lists while other users cannot read, query, change or delete them", async () => {
  const alice=verified('alice');const bob=verified('bob');
  const ref=db=>doc(db,'users','alice','lists','desk');
  const value={name:'Desk refresh',products:[100,101],updatedAt:serverTimestamp()};
  await assertSucceeds(setDoc(ref(alice),value));
  await assertSucceeds(getDocs(collection(alice,'users','alice','lists')));
  await assertFails(getDoc(ref(bob)));
  await assertFails(getDocs(collection(bob,'users','alice','lists')));
  await assertFails(setDoc(ref(bob),value));
  await assertFails(deleteDoc(ref(bob)));
  await assertSucceeds(deleteDoc(ref(alice)));
});
test("lists reject unverified access, unknown products, oversized names and forged fields", async () => {
  const alice=verified('alice');
  const ref=db=>doc(db,'users','alice','lists','desk');
  const value={name:'Gift ideas',products:[100],updatedAt:serverTimestamp()};
  const unverified=env.authenticatedContext('alice',{email_verified:false}).firestore();
  await assertFails(setDoc(ref(unverified),value));
  await assertFails(getDocs(collection(env.unauthenticatedContext().firestore(),'users','alice','lists')));
  for(const bad of [{...value,name:''},{...value,name:'x'.repeat(61)},{...value,products:[999]},{...value,products:Array(13).fill(100)},{...value,paid:true},{...value,updatedAt:new Date(0)}]) await assertFails(setDoc(ref(alice),bad));
});
