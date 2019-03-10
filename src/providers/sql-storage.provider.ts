import { Injectable } from '@angular/core';
import { Platform } from 'ionic-angular';
import { BehaviorSubject } from 'rxjs/Rx';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { EBookEntity } from '../model/EBookEntity';


/**
 * Wrapper class for SQLLite plugin. Provides methods for
 * creation of db and subsequent querying.
 * Handles both device and browser platforms. 
 * 
 */

@Injectable()
export class SqlStorageProvider {

  private databaseReady: BehaviorSubject<boolean>;

  storage: any;
  dbQueries: Map<number, DBQuery[]> = new Map();
  DB_NAME: string = 'ebookReader';
  DB_VERSION: number = 1;

  public ebooks: EBookEntity[] = [];

  constructor(public platform: Platform, public sqlite: SQLite) {
    this.databaseReady = new BehaviorSubject(false);
    this.populateDBQueries();


    this.platform.ready().then(() => {
      if (this.platform.is('cordova')) {
        this.sqlite.create({ name: this.DB_NAME, location: 'default' })
          .then((db: SQLiteObject) => {
            this.storage = db;
            this.tryInit();
          });
      } else {
        this.storage = (<any>window).openDatabase(this.DB_NAME, "1.0", "database", 200000);
        this.tryInit();
      }
    });

  }

  tryInit() {

    this.query('CREATE TABLE IF NOT EXISTS dbversion (version integer)')
      .then(() => {

        this.getDBVersion().then(currentVersion => {
          if (!currentVersion) {
            //first installation
            console.log("db not found, required version " + this.DB_VERSION);
            this.createDBFromVersion(1)
              .then(() => {
                console.log('db structure ready!!!')
                this.query('INSERT INTO dbversion(version) values (?)', [this.DB_VERSION])
                  .then(() => {
                    console.log("db created successfully!");
                    this.databaseReady.next(true);

                  },
                    (error) => {
                      console.error('Error while updating dbversion', error);
                    })
                  .catch(err => {
                    console.error('Error while updating dbversion', err.tx, err.err);
                  })
              })
              .catch(err => {
                console.error('Error while creating db', err.tx, err.err);
              })
          }
          else if (currentVersion < this.DB_VERSION) {
            //old version - update required
            console.log("current db version " + currentVersion + " is older than required version " + this.DB_VERSION);
            this.createDBFromVersion(currentVersion + 1)
              .then(() => {
                console.log('db structure ready!!!')
                this.query('UPDATE dbversion set version = ?', [this.DB_VERSION])
                  .then(() => {
                    console.log("db updated successfully!");
                    this.databaseReady.next(true);
                  })
                  .catch(err => {
                    console.error('Error while updating dbversion', err.tx, err.err);
                  })
              })
              .catch(err => {
                console.error('Error while creating db', err.tx, err.err);
              })
          }
          else {
            //db already up-to-date
            console.log('DB strucure already up-to-date. version: ' + this.DB_VERSION);
            this.databaseReady.next(true);
          }
        })

      })
      .catch(err => {
        console.error('Error while creating dbversion', err.tx, err.err);
      })

  }

  getDBVersion(): Promise<any> {
    return this.query('select version from dbversion').then(
      data => {
        if (data.res.rows.length > 0) {
          return data.res.rows.item(0).version;
        }
      },
      error => {
        console.error("ERROR in getDBVersion" + error);
      });
  }


  createDBFromVersion(startVersion: number): Promise<any> {

    if (this.platform.is('cordova')) {
      //execute all statements in a single transaction and resolve promise after successful transaction
      //NOTE: websql api's transaction function accepts error and success callbacks as arguments
      // However, ionic native's transaction function does not require them since the function itself returns
      // a promise which resolves/rejects basis success/failure of transaction
      return this.storage.transaction(
        (tx: any) => {
          for (let i = startVersion; i <= this.DB_VERSION; i++) {
            let queries: DBQuery[] = this.dbQueries.get(i);
            for (let j = 0; j < queries.length; j++) {
              console.log("executing query: " + queries[j].query);
              tx.executeSql(queries[j].query, queries[j].params,
                (tx: any, res: any) => console.log('query success'),
                (tx: any, err: any) => console.log('query failed: ', err)
              );
            }
          }
        }
      );
    }
    else {
      //execute all statements in a single transaction and resolve promise after successful transaction
      //NOTE: WebSQL db's transaction function's success callback is used to resolve the promise returned
      return new Promise<any>((resolve, reject) => {
        this.storage.transaction(
          (tx: any) => {
            for (let i = startVersion; i <= this.DB_VERSION; i++) {
              let queries: DBQuery[] = this.dbQueries.get(i);
              for (let j = 0; j < queries.length; j++) {
                console.log("executing query: " + queries[j].query);
                tx.executeSql(queries[j].query, queries[j].params,
                  (tx: any, res: any) => console.log('query success'),
                  (tx: any, err: any) => console.log('query failed: ', err)
                );
              }
            }
          },
          (err) => {
            console.error("ERROR: while creating db: ", err);
            reject(err);
          },
          () => resolve()
        );

      })
    }
  }


  insertBook(book: EBookEntity): Promise<any> {

    let now: number = new Date().getTime();
    return this.query(
      'insert into myebooks(bookId, lastUsedTime) values (?, ?)', [book.bookId, now])
      .then(
        () => {
          //add to cache
          book.lastUsedTime = now;
          this.ebooks.push(book);
          console.log("inserted ebook record in db and cache!");
        }
      )
  }


  getEBooks(): Promise<EBookEntity[]> {
    return new Promise((resolve, reject) => {
      //if cache is loaded
      if (this.ebooks.length > 0) {
        console.log("book cache already loaded: ", this.ebooks);
        resolve(this.ebooks);
      }
      else {
        this.query('select bookId, lastUsedTime from myebooks', [])
          .then(
            data => {
              let result = data.res.rows;
              console.log("get ebooks result count: " + result.length);
              for (var x = 0; x < result.length; x++) {
                let book: EBookEntity = {
                  bookId: result.item(x).bookId,
                  lastUsedTime: result.item(x).lastUsedTime
                }
                this.ebooks.push(book);
              }
              resolve(this.ebooks);
            },
            error => {
              console.error('ERROR in getting ebook map', error);
              reject(error);
            }
          )
      }
    })
  }

  getDatabaseState() {
    return this.databaseReady.asObservable();
  }

  query(query: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        this.storage.transaction((tx: any) => {
          tx.executeSql(query, params,
            (tx: any, res: any) => resolve({ tx: tx, res: res }),
            (tx: any, err: any) => reject({ tx: tx, err: err }));
        },
          (err: any) => {
            console.log('error executing query' + query + " : ", err)
            reject({ err: err })
          }
        );
      } catch (err) {
        reject({ err: err });
      }
    });
  }

  public updateLastUsedTime(bookId: string): Promise<any> {
    let now: number = new Date().getTime();
    console.log("updating last used time for " + bookId);
    return this.query("UPDATE myebooks SET lastUsedTime = ? WHERE bookId = ?", [now, bookId]).then(
      () => {
        //update value in cache
        for(let book of this.ebooks){
          if (book.bookId == bookId) {
            book.lastUsedTime = now;
            console.log("updated last used time in cache for " + bookId);
            break;
          }
        }
      })
  }


  populateDBQueries() {
    this.dbQueries.set(1, [
      {
        query: 'CREATE TABLE IF NOT EXISTS myebooks (' +
          'bookId text primary key, lastUsedTime integer)',
        params: []
      }
    ]);
  }
}

export interface DBQuery {
  query: string;
  params: any[];
}