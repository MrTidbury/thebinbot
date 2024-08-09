//
//  BaseView.swift
//  BinBot
//
//  Created by Sbeve on 02/08/2024.
//

import SwiftUI

struct BaseView: View {
    
    // Pull the UserId from Cache...
    @AppStorage("userIdCache") var cachedUserID: String = ""
    
    var body: some View {
        if (cachedUserID.isEmpty) {
            // User not logged in, render the login page...
            LogInView(UserId: $cachedUserID)
        } else {
            // User is logged in, render the login page...
            MainView(UserId: $cachedUserID)
        }
    }
}

#Preview {
    BaseView()
}
